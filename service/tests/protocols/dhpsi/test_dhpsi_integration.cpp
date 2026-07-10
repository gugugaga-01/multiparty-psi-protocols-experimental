#include "core/party_config.h"
#include "core/protocol.h"
#include "core/transport/in_process_channel.h"
#include "protocols/dhpsi/dhpsi_protocol.h"
#include "protocols/dhpsi/protocol/dh_psi.h"

#include <gtest/gtest.h>

#include <exception>
#include <string>
#include <thread>
#include <vector>

namespace {

std::vector<std::string> runInProcess(const std::vector<std::string>& leader_elements,
                                      const std::vector<std::string>& member_elements) {
    auto [leader_channel, member_channel] = mpsi::InProcessChannel::createPair();

    std::vector<std::string> result;
    std::exception_ptr leader_error;
    std::exception_ptr member_error;

    std::thread member_thread([&] {
        try {
            mpsi::dhpsi::DhPsiMember().run(member_elements, *member_channel);
        } catch (...) {
            member_error = std::current_exception();
        }
    });

    std::thread leader_thread([&] {
        try {
            result = mpsi::dhpsi::DhPsiLeader().run(leader_elements, *leader_channel);
        } catch (...) {
            leader_error = std::current_exception();
        }
    });

    leader_thread.join();
    member_thread.join();

    if (leader_error)
        std::rethrow_exception(leader_error);
    if (member_error)
        std::rethrow_exception(member_error);

    return result;
}

mpsi::PartyConfig makeConfig(uint64_t party_id, uint64_t num_parties) {
    mpsi::PartyConfig config;
    config.party_id = party_id;
    config.num_parties = num_parties;
    config.protocol = "dh_psi";
    for (uint64_t i = 0; i < num_parties; ++i)
        config.party_addresses.push_back("party" + std::to_string(i));
    return config;
}

} // namespace

TEST(DhPsiInProcessTest, ReturnsOverlapInLeaderOrder) {
    std::vector<std::string> result = runInProcess(
        {"alpha", "beta", "gamma", "delta"},
        {"delta", "beta", "epsilon"});

    EXPECT_EQ(result, (std::vector<std::string>{"beta", "delta"}));
}

TEST(DhPsiInProcessTest, ReturnsEmptyIntersection) {
    std::vector<std::string> result = runInProcess(
        {"alpha", "beta", "gamma"},
        {"delta", "epsilon", "zeta"});

    EXPECT_TRUE(result.empty());
}

TEST(DhPsiInProcessTest, HandlesUnequalSetSizes) {
    std::vector<std::string> result = runInProcess(
        {"one", "two", "three", "four", "five"},
        {"zero", "three"});

    EXPECT_EQ(result, (std::vector<std::string>{"three"}));
}

TEST(DhPsiInProcessTest, SuppressesDuplicateLeaderMatches) {
    std::vector<std::string> result = runInProcess(
        {"alpha", "beta", "alpha", "gamma", "beta"},
        {"beta", "alpha"});

    EXPECT_EQ(result, (std::vector<std::string>{"alpha", "beta"}));
}

TEST(DhPsiValidationTest, RejectsInvalidPartyCount) {
    mpsi::DhPsiProtocol protocol;
    mpsi::PartyConfig config = makeConfig(0, 3);
    ASSERT_TRUE(protocol.setup(config));

    mpsi::ProtocolContext ctx{
        config,
        true,
        0,
        {1, 2},
        2,
    };

    std::string err = protocol.validate(ctx, {"alpha"});
    EXPECT_NE(err.find("exactly 2 parties"), std::string::npos);
}

TEST(DhPsiValidationTest, RejectsInvalidThreshold) {
    mpsi::DhPsiProtocol protocol;
    mpsi::PartyConfig config = makeConfig(0, 2);
    ASSERT_TRUE(protocol.setup(config));

    mpsi::ProtocolContext ctx{
        config,
        true,
        0,
        {1},
        1,
    };

    std::string err = protocol.validate(ctx, {"alpha"});
    EXPECT_NE(err.find("threshold 2"), std::string::npos);
}
