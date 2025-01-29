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

interface PositionData {
  id: string;
  owner: string;
  pool: string;
  priceSqrt: BigInt;
  nftAddress: string;
  tickLower: number;
  tickUpper: number;
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
      variables: {
        where: {
          nftAddress: nftAddressParsed,
        },
      },
    });

    const positionsList = response.data.positions;

    if (positionsList.length === 0) {
      console.log("Позиции для данного NFT не найдены.");
      return null;
    }

    const position = positionsList[0]; 
    const poolAddress = position.pool;
    const tickLower = position.tickLower;
    const tickUpper = position.tickUpper;

    console.log(`Найден пул с адресом: ${poolAddress}`);
    console.log(`Tick Lower: ${tickLower}`);
    console.log(`Tick Upper: ${tickUpper}`);

    const formattedPoolAddress = Address.parse(poolAddress).toString();

    const endpoint = await getHttpV4Endpoint();
    const client = new TonClient4({ endpoint });
    const poolV3Contract = client.open(new PoolV3Contract(Address.parse(poolAddress)));

    const poolState = await poolV3Contract.getPoolStateAndConfiguration();

    console.log("Состояние пула:", poolState);

    return {
      id: position.id,
      owner: position.owner,
      pool: formattedPoolAddress,
      nftAddress: position.nftAddress,
      priceSqrt: poolState.price_sqrt,
      tickLower,
      tickUpper,
    };
  } catch (error) {
    console.error("Ошибка при запросе данных о пуле:", error);
    return null;
  }
}

export { getPoolAddressByNFT };
