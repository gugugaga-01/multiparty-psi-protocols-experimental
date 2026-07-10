#include "protocols/dhpsi/protocol/dh_psi.h"

#include <algorithm>
#include <cstdint>
#include <cstring>
#include <limits>
#include <stdexcept>
#include <unordered_set>

namespace mpsi::dhpsi {
namespace {

constexpr uint64_t kMaxElements = 100000;
constexpr char kHashToGroupDomain[] = "mpsi:dh_psi:v1:hash_to_ristretto255";
constexpr char kTokenDomain[] = "mpsi:dh_psi:v1:token";

Scalar randomScalar() {
    ensureSodiumInitialized();

    Scalar scalar{};
    do {
        crypto_core_ristretto255_scalar_random(scalar.data());
    } while (sodium_is_zero(scalar.data(), scalar.size()) == 1);
    return scalar;
}

template <std::size_t N>
std::string toFrame(const std::array<unsigned char, N>& value) {
    return std::string(reinterpret_cast<const char*>(value.data()), value.size());
}

template <std::size_t N>
std::array<unsigned char, N> fromFrame(const std::string& frame,
                                       std::string_view label) {
    if (frame.size() != N) {
        throw std::runtime_error(std::string(label) + " frame has invalid size: got " +
                                 std::to_string(frame.size()) + ", expected " +
                                 std::to_string(N));
    }

    std::array<unsigned char, N> value{};
    std::copy_n(reinterpret_cast<const unsigned char*>(frame.data()), N, value.data());
    return value;
}

template <typename T>
void checkSendCount(const std::vector<T>& values, std::string_view label) {
    if (values.size() > kMaxElements) {
        throw std::runtime_error(std::string(label) + " count exceeds maximum " +
                                 std::to_string(kMaxElements));
    }
}

uint64_t recvCount(mpsi::Channel& channel, std::string_view label) {
    uint64_t count = channel.recvU64();
    if (count > kMaxElements) {
        throw std::runtime_error(std::string(label) + " count exceeds maximum " +
                                 std::to_string(kMaxElements));
    }
    if (count > static_cast<uint64_t>(std::numeric_limits<std::size_t>::max())) {
        throw std::runtime_error(std::string(label) + " count does not fit in size_t");
    }
    return count;
}

std::vector<Point> blindElements(const std::vector<std::string>& elements,
                                 const Scalar& scalar) {
    std::vector<Point> blinded;
    blinded.reserve(elements.size());
    for (const auto& element : elements)
        blinded.push_back(blindPoint(hashToPoint(element), scalar));
    return blinded;
}

std::vector<Token> tokensForPoints(const std::vector<Point>& points,
                                   const Scalar& scalar) {
    std::vector<Token> tokens;
    tokens.reserve(points.size());
    for (const auto& point : points)
        tokens.push_back(tokenFromPoint(blindPoint(point, scalar)));
    return tokens;
}

struct TokenHash {
    std::size_t operator()(const Token& token) const noexcept {
        std::uint64_t h = 1469598103934665603ULL;
        for (unsigned char b : token) {
            h ^= static_cast<std::uint64_t>(b);
            h *= 1099511628211ULL;
        }
        return static_cast<std::size_t>(h);
    }
};

} // namespace

void ensureSodiumInitialized() {
    static const int rc = sodium_init();
    if (rc < 0)
        throw std::runtime_error("libsodium init failed");
}

Point hashToPoint(std::string_view element) {
    ensureSodiumInitialized();

    std::array<unsigned char, crypto_core_ristretto255_HASHBYTES> hash{};
    crypto_generichash_state state;
    if (crypto_generichash_init(&state, nullptr, 0, hash.size()) != 0)
        throw std::runtime_error("crypto_generichash_init failed");

    crypto_generichash_update(
        &state,
        reinterpret_cast<const unsigned char*>(kHashToGroupDomain),
        sizeof(kHashToGroupDomain) - 1);
    if (!element.empty()) {
        crypto_generichash_update(
            &state,
            reinterpret_cast<const unsigned char*>(element.data()),
            element.size());
    }
    crypto_generichash_final(&state, hash.data(), hash.size());

    Point point{};
    crypto_core_ristretto255_from_hash(point.data(), hash.data());
    return point;
}

Point blindPoint(const Point& point, const Scalar& scalar) {
    ensureSodiumInitialized();

    if (crypto_core_ristretto255_is_valid_point(point.data()) != 1)
        throw std::runtime_error("invalid Ristretto255 point");

    Point blinded{};
    if (crypto_scalarmult_ristretto255(blinded.data(), scalar.data(), point.data()) != 0)
        throw std::runtime_error("Ristretto255 scalar multiplication failed");
    return blinded;
}

Token tokenFromPoint(const Point& point) {
    ensureSodiumInitialized();

    Token token{};
    crypto_generichash_state state;
    if (crypto_generichash_init(&state, nullptr, 0, token.size()) != 0)
        throw std::runtime_error("crypto_generichash_init failed");

    crypto_generichash_update(
        &state,
        reinterpret_cast<const unsigned char*>(kTokenDomain),
        sizeof(kTokenDomain) - 1);
    crypto_generichash_update(&state, point.data(), point.size());
    crypto_generichash_final(&state, token.data(), token.size());
    return token;
}

void sendPoints(mpsi::Channel& channel, const std::vector<Point>& points) {
    checkSendCount(points, "point");
    channel.sendU64(points.size());
    for (const auto& point : points)
        channel.sendBytes(toFrame(point));
    channel.flush();
}

std::vector<Point> recvPoints(mpsi::Channel& channel, std::string_view label) {
    uint64_t count = recvCount(channel, label);
    std::vector<Point> points;
    points.reserve(static_cast<std::size_t>(count));

    for (uint64_t i = 0; i < count; ++i) {
        Point point = fromFrame<kPointBytes>(channel.recvBytes(), label);
        if (crypto_core_ristretto255_is_valid_point(point.data()) != 1)
            throw std::runtime_error(std::string(label) + " contains invalid Ristretto255 point");
        points.push_back(point);
    }
    return points;
}

void sendTokens(mpsi::Channel& channel, const std::vector<Token>& tokens) {
    checkSendCount(tokens, "token");
    channel.sendU64(tokens.size());
    for (const auto& token : tokens)
        channel.sendBytes(toFrame(token));
    channel.flush();
}

std::vector<Token> recvTokens(mpsi::Channel& channel, std::string_view label) {
    uint64_t count = recvCount(channel, label);
    std::vector<Token> tokens;
    tokens.reserve(static_cast<std::size_t>(count));

    for (uint64_t i = 0; i < count; ++i)
        tokens.push_back(fromFrame<kTokenBytes>(channel.recvBytes(), label));
    return tokens;
}

std::vector<std::string> DhPsiLeader::run(
    const std::vector<std::string>& elements,
    mpsi::Channel& channel) const {
    Scalar scalar = randomScalar();

    std::vector<Point> leader_blinded = blindElements(elements, scalar);
    sendPoints(channel, leader_blinded);

    std::vector<Point> member_blinded = recvPoints(channel, "member blinded points");
    std::vector<Token> leader_tokens = recvTokens(channel, "leader double-blinded tokens");

    if (leader_tokens.size() != elements.size()) {
        throw std::runtime_error("member returned " +
                                 std::to_string(leader_tokens.size()) +
                                 " leader tokens for " +
                                 std::to_string(elements.size()) +
                                 " leader elements");
    }

    std::vector<Token> member_tokens = tokensForPoints(member_blinded, scalar);
    std::unordered_set<Token, TokenHash> member_token_set;
    member_token_set.reserve(member_tokens.size());
    for (const auto& token : member_tokens)
        member_token_set.insert(token);

    std::unordered_set<Token, TokenHash> emitted_tokens;
    emitted_tokens.reserve(leader_tokens.size());

    std::vector<std::string> result;
    for (std::size_t i = 0; i < elements.size(); ++i) {
        const Token& token = leader_tokens[i];
        if (member_token_set.find(token) == member_token_set.end())
            continue;
        if (!emitted_tokens.insert(token).second)
            continue;
        result.push_back(elements[i]);
    }
    return result;
}

void DhPsiMember::run(const std::vector<std::string>& elements,
                      mpsi::Channel& channel) const {
    Scalar scalar = randomScalar();

    std::vector<Point> leader_blinded = recvPoints(channel, "leader blinded points");
    std::vector<Point> member_blinded = blindElements(elements, scalar);
    std::vector<Token> leader_tokens = tokensForPoints(leader_blinded, scalar);

    sendPoints(channel, member_blinded);
    sendTokens(channel, leader_tokens);
}

} // namespace mpsi::dhpsi
