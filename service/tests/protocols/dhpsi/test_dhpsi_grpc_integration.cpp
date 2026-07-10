#include "core/party_config.h"
#include "core/protocol.h"
#include "protocols/dhpsi/dhpsi_protocol.h"

#include <gtest/gtest.h>

#include <chrono>
#include <exception>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

namespace {

mpsi::PartyConfig makeGrpcConfig(uint64_t party_id,
                                 const std::string& member_addr,
                                 const std::string& leader_addr) {
    mpsi::PartyConfig config;
    config.party_id = party_id;
    config.num_parties = 2;
    config.party_addresses = {member_addr, leader_addr};
    config.protocol = "dh_psi";
    return config;
}

std::vector<std::string> runGrpcProtocol(
    int base_port,
    const std::vector<std::string>& leader_elements,
    const std::vector<std::string>& member_elements) {
    std::string member_addr = "127.0.0.1:" + std::to_string(base_port);
    std::string leader_addr = "127.0.0.1:" + std::to_string(base_port + 1);

    mpsi::PartyConfig member_config = makeGrpcConfig(0, member_addr, leader_addr);
    mpsi::PartyConfig leader_config = makeGrpcConfig(1, member_addr, leader_addr);

    mpsi::DhPsiProtocol member_protocol;
    mpsi::DhPsiProtocol leader_protocol;
    if (!member_protocol.setup(member_config))
        throw std::runtime_error("member setup failed");
    if (!leader_protocol.setup(leader_config))
        throw std::runtime_error("leader setup failed");

    mpsi::ProtocolContext member_ctx{
        member_config,
        false,
        1,
        {0},
        2,
    };
    mpsi::ProtocolContext leader_ctx{
        leader_config,
        true,
        1,
        {0},
        2,
    };

    std::vector<std::string> result;
    std::exception_ptr member_error;
    std::exception_ptr leader_error;

    std::thread member_thread([&] {
        try {
            std::vector<std::string> member_result =
                member_protocol.run(member_ctx, member_elements);
            if (!member_result.empty())
                throw std::runtime_error("member returned an intersection");
        } catch (...) {
            member_error = std::current_exception();
        }
    });

    std::this_thread::sleep_for(std::chrono::milliseconds(300));

    std::thread leader_thread([&] {
        try {
            result = leader_protocol.run(leader_ctx, leader_elements);
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

} // namespace

TEST(DhPsiGrpcIntegrationTest, ComputesOverlapThroughPluginTransport) {
    std::vector<std::string> result = runGrpcProtocol(
        50330,
        {"alpha", "beta", "gamma", "delta"},
        {"delta", "beta", "epsilon"});

    EXPECT_EQ(result, (std::vector<std::string>{"beta", "delta"}));
}

TEST(DhPsiGrpcIntegrationTest, SuppressesDuplicateLeaderInputsThroughPluginTransport) {
    std::vector<std::string> result = runGrpcProtocol(
        50340,
        {"alpha", "beta", "alpha", "gamma"},
        {"gamma", "alpha"});

    EXPECT_EQ(result, (std::vector<std::string>{"alpha", "gamma"}));
}
