#pragma once

#include "core/transport/channel.h"

#include <sodium.h>

#include <array>
#include <cstddef>
#include <string>
#include <string_view>
#include <vector>

namespace mpsi::dhpsi {

constexpr std::size_t kPointBytes = crypto_core_ristretto255_BYTES;
constexpr std::size_t kScalarBytes = crypto_core_ristretto255_SCALARBYTES;
constexpr std::size_t kTokenBytes = crypto_generichash_BYTES;

using Point = std::array<unsigned char, kPointBytes>;
using Scalar = std::array<unsigned char, kScalarBytes>;
using Token = std::array<unsigned char, kTokenBytes>;

void ensureSodiumInitialized();

Point hashToPoint(std::string_view element);
Point blindPoint(const Point& point, const Scalar& scalar);
Token tokenFromPoint(const Point& point);

void sendPoints(mpsi::Channel& channel, const std::vector<Point>& points);
std::vector<Point> recvPoints(mpsi::Channel& channel, std::string_view label);

void sendTokens(mpsi::Channel& channel, const std::vector<Token>& tokens);
std::vector<Token> recvTokens(mpsi::Channel& channel, std::string_view label);

class DhPsiLeader {
public:
    std::vector<std::string> run(const std::vector<std::string>& elements,
                                 mpsi::Channel& channel) const;
};

class DhPsiMember {
public:
    void run(const std::vector<std::string>& elements,
             mpsi::Channel& channel) const;
};

} // namespace mpsi::dhpsi
