import { ApolloClient, InMemoryCache, gql } from "@apollo/client/core";
import { Address, TonClient4 } from "@ton/ton";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { PoolV3Contract } from "@toncodex/sdk";

const POSITION_QUERY = gql`
  query PositionQuery($where: PositionWhere) {
    positions(where: $where) {
      id
      owner
      pool
      nftAddress
      tickLower
      tickUpper
    }
  }
`;

const POOL_QUERY = gql`
  query PoolQuery($where: PoolWhere) {
    pools(where: $where) {
      name
    }
  }
`;

interface PositionData {
  id: string;
  owner: string;
  pool: string;
  priceSqrt: bigint;
  nftAddress: string;
  tickLower: number;
  tickUpper: number;
  poolName: string;
}

async function getPoolAddressByNFT(nftAddress: string): Promise<PositionData | null> {
  const appoloClient = new ApolloClient({
    uri: "https://indexer.tonco.io/",
    credentials: "same-origin",
    cache: new InMemoryCache(),
  });

  try {
    const nftAddressParsed = Address.parse(nftAddress).toRawString();

    const response = await appoloClient.query({
      query: POSITION_QUERY,
      variables: { where: { nftAddress: nftAddressParsed } },
    });

    const positionsList = response.data.positions;
    if (!positionsList || positionsList.length === 0) {
      console.log("Позиции для данного NFT не найдены.");
      return null;
    }

    const position = positionsList[0];
    const poolAddress = position.pool;
    const tickLower = position.tickLower;
    const tickUpper = position.tickUpper;

    console.log(`Найден пул с адресом: ${poolAddress}`);

    const poolNameResponse = await appoloClient.query({
      query: POOL_QUERY,
      variables: { where: { address: poolAddress } }, 
    });

    const poolData = poolNameResponse.data.pools;
    const poolName = poolData && poolData.length > 0 ? poolData[0].name : "Неизвестный пул";

    console.log(`Название пула: ${poolName}`);

    const formattedPoolAddress = Address.parse(poolAddress).toString();
    const endpoint = await getHttpV4Endpoint();
    const client = new TonClient4({ endpoint });
    const poolV3Contract = client.open(new PoolV3Contract(Address.parse(poolAddress)));
    const poolState = await poolV3Contract.getPoolStateAndConfiguration();

    return {
      id: position.id,
      owner: position.owner,
      pool: formattedPoolAddress,
      nftAddress: position.nftAddress,
      priceSqrt: poolState.price_sqrt,
      tickLower,
      tickUpper,
      poolName,
    };
  } catch (error) {
    console.error("Ошибка при запросе данных о пуле:", error);
    return null;
  }
}

export { getPoolAddressByNFT };