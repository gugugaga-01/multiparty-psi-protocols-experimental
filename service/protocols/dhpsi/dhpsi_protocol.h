#pragma once

#include "core/protocol.h"

#include <string>
#include <vector>

namespace mpsi {

class DhPsiProtocol final : public PsiProtocol {
public:
    std::string name() const override { return "dh_psi"; }

    bool setup(const PartyConfig& config) override;

    std::string validate(const ProtocolContext& ctx,
                         const std::vector<std::string>& elements) override;

    std::vector<std::string> run(const ProtocolContext& ctx,
                                 const std::vector<std::string>& elements) override;

private:
    std::vector<std::string> runLeader(const std::vector<std::string>& elements,
                                       uint64_t member_id);
    void runMember(const std::vector<std::string>& elements,
                   uint64_t leader_id);

    PartyConfig config_;
};

} // namespace mpsi
