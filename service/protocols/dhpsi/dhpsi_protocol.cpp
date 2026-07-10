#include "protocols/dhpsi/dhpsi_protocol.h"

#include "core/transport/party_server.h"
#include "protocols/dhpsi/protocol/dh_psi.h"

#include <condition_variable>
#include <cstdint>
#include <exception>
#include <iostream>
#include <memory>
#include <mutex>
#include <stdexcept>

namespace mpsi {

bool DhPsiProtocol::setup(const PartyConfig& config) {
    config_ = config;
    try {
        dhpsi::ensureSodiumInitialized();
    } catch (const std::exception& e) {
        std::cerr << "[Party " << config.party_id
                  << "] DH PSI unavailable: " << e.what() << std::endl;
        return false;
    }

    std::cerr << "[Party " << config.party_id
              << "] DH PSI: Ready (dealerless)" << std::endl;
    return true;
}

std::string DhPsiProtocol::validate(const ProtocolContext& ctx,
                                    const std::vector<std::string>& elements) {
    (void)elements;

    if (ctx.config.num_parties != 2)
        return "dh_psi requires exactly 2 parties";
    if (ctx.config.party_addresses.size() != 2)
        return "dh_psi requires exactly 2 party addresses";
    if (ctx.threshold != 2)
        return "dh_psi requires threshold 2";
    if (ctx.leader_id >= ctx.config.num_parties)
        return "leader_id is out of range";
    if (ctx.config.party_id >= ctx.config.num_parties)
        return "party_id is out of range";
    if (ctx.member_ids.size() != 1)
        return "dh_psi requires exactly one member";

    uint64_t member_id = ctx.member_ids[0];
    if (member_id >= ctx.config.num_parties)
        return "member_id is out of range";
    if (member_id == ctx.leader_id)
        return "dh_psi member must be distinct from leader";

    if (ctx.is_leader) {
        if (ctx.config.party_id != ctx.leader_id)
            return "leader role must run on the configured leader party";
    } else {
        if (ctx.config.party_id == ctx.leader_id)
            return "member role cannot run on the configured leader party";
        if (ctx.config.party_id != member_id)
            return "member role must run on the sole configured member party";
    }

    return "";
}

std::vector<std::string> DhPsiProtocol::run(
    const ProtocolContext& ctx,
    const std::vector<std::string>& elements) {
    std::string err = validate(ctx, elements);
    if (!err.empty())
        throw std::runtime_error(err);

    if (ctx.is_leader)
        return runLeader(elements, ctx.member_ids[0]);

    runMember(elements, ctx.leader_id);
    return {};
}

std::vector<std::string> DhPsiProtocol::runLeader(
    const std::vector<std::string>& elements,
    uint64_t member_id) {
    auto creds = makeClientCredentials(config_.inter_party_tls);
    GrpcIdentifiedClientChannel channel(
        config_.party_addresses[member_id],
        creds,
        config_.party_id);

    try {
        std::vector<std::string> result = dhpsi::DhPsiLeader().run(elements, channel);
        channel.close();
        return result;
    } catch (...) {
        try {
            channel.close();
        } catch (...) {
        }
        throw;
    }
}

void DhPsiProtocol::runMember(const std::vector<std::string>& elements,
                              uint64_t leader_id) {
    PartyServer inter_server(config_.party_addresses[config_.party_id],
                             config_.inter_party_tls);

    std::mutex mu;
    std::condition_variable cv;
    bool connected = false;
    bool done = false;
    GrpcServerChannel* leader_channel = nullptr;

    inter_server.service().expectParty(leader_id, [&](GrpcServerChannel* ch) {
        {
            std::lock_guard<std::mutex> lock(mu);
            leader_channel = ch;
            connected = true;
        }
        cv.notify_all();

        std::unique_lock<std::mutex> lock(mu);
        cv.wait(lock, [&] { return done; });
    });

    inter_server.start();

    {
        std::unique_lock<std::mutex> lock(mu);
        cv.wait(lock, [&] { return connected; });
    }

    try {
        dhpsi::DhPsiMember().run(elements, *leader_channel);
    } catch (...) {
        {
            std::lock_guard<std::mutex> lock(mu);
            done = true;
        }
        cv.notify_all();
        inter_server.shutdown();
        throw;
    }

    {
        std::lock_guard<std::mutex> lock(mu);
        done = true;
    }
    cv.notify_all();
    inter_server.shutdown();
}

} // namespace mpsi
