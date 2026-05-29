
#include <cerrno>
#include <cstdlib>
#include <iostream>
#include <limits>
#include "Network/BtChannel.h"
#include "Network/BtEndpoint.h"

using namespace std;
#include "Common/Defines.h"
using namespace osuCrypto;

#include "OtBinMain.h"
#include <numeric>
#include "Common/Log.h"


void usage(const char* argv0)
{
    std::cout << "Error! Please use:" << std::endl;
    std::cout << "\t 1. For unit test: " << argv0 << " -u" << std::endl;
    std::cout << "\t 2. For simulation (5 parties <=> 5 terminals): " << std::endl;;
    std::cout << "\t\t each terminal: " << argv0 << " -n 5 -m 12 -p [pIdx]" << std::endl;

}

static bool parseU64(const char* text, u64& out)
{
    if (text == nullptr || *text == '\0')
        return false;

    errno = 0;
    char* end = nullptr;
    unsigned long long value = std::strtoull(text, &end, 10);
    if (errno == ERANGE || end == text || *end != '\0')
        return false;

    out = static_cast<u64>(value);
    return true;
}

int main(int argc, char** argv)
{
    u64 trials = 1;
    u64 nParties = 0, setSize = 0;

    if (argc != 7 || argv[1][0] != '-' || argv[1][1] != 'n' ||
        argv[3][0] != '-' || argv[3][1] != 'm' ||
        argv[5][0] != '-' || argv[5][1] != 'p') {
        usage(argv[0]);
        return 1;
    }

    u64 logSetSize = 0;
    u64 pIdx = 0;
    if (!parseU64(argv[2], nParties) || !parseU64(argv[4], logSetSize) ||
        !parseU64(argv[6], pIdx) || logSetSize >= 63 || nParties == 0 ||
        pIdx >= nParties) {
        usage(argv[0]);
        return 1;
    }

    setSize = u64{1} << logSetSize;
    tparty(pIdx, nParties, setSize, trials);
    return 0;
}
