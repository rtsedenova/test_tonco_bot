import { Address, TonClient4 } from "@ton/ton";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { PoolV3Contract } from "@toncodex/sdk";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client/core";

const SCALE_FACTOR = Math.pow(2, 96);

const POOLS_QUERY = gql`
    query PoolsQuery {
        pools {
            name
            address
        }
    }
`;

async function getPoolsMap(): Promise<Record<string, string>> {
    try {
        const apolloClient = new ApolloClient({
            uri: "https://indexer.tonco.io/",
            cache: new InMemoryCache(),
        });

        const response = await apolloClient.query({ query: POOLS_QUERY });
        const pools = response.data.pools;

        return pools.reduce((map: Record<string, string>, pool: { name: string; address: string }) => {
            const normalizedAddress = Address.parse(pool.address).toString(); 
            map[normalizedAddress] = pool.name;
            return map;
        }, {});
    } catch (error) {
        console.error("Ошибка при запросе списка пулов:", error);
        throw new Error("Не удалось загрузить список пулов.");
    }
}

export async function getPriceSqrt(poolAddress: string): Promise<{ poolName: string; priceSqrt: string; price: number }> {
    try {
        const endpoint = await getHttpV4Endpoint();
        const client = new TonClient4({ endpoint });

        const normalizedAddress = Address.parse(poolAddress).toString(); 
        const poolV3Contract = client.open(new PoolV3Contract(Address.parse(poolAddress)));

        const poolState = await poolV3Contract.getPoolStateAndConfiguration();

        const priceSqrt = BigInt(poolState.price_sqrt.toString());
        const normalizedPriceSqrt = Number(priceSqrt) / SCALE_FACTOR;
        const price = normalizedPriceSqrt ** 2 * 1000;

        const poolsMap = await getPoolsMap();
        const poolName = poolsMap[normalizedAddress] || "Неизвестный пул";

        return { poolName, priceSqrt: priceSqrt.toString(), price };
    } catch (error) {
        console.error("Ошибка при получении данных о пуле:", error);
        throw new Error("Не удалось получить данные о пуле.");
    }
}
