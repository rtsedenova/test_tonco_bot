import { ApolloClient, InMemoryCache, gql } from "@apollo/client/core";
import { Address } from "@ton/ton";

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
  nftAddress: string;
  tickLower: number;
  tickUpper: number;
}

async function getPoolAddressByNFT(nftAddress: string): Promise<PositionData | null> {
  const appoloClient = new ApolloClient({
    uri: "https://indexer.tonco.io/", // Замените на ваш GraphQL endpoint
    credentials: "same-origin",
    cache: new InMemoryCache(),
  });

  try {
    // Преобразуем адрес NFT в правильный формат для GraphQL запроса
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

    const position = positionsList[0]; // Предположим, что нас интересует только первая позиция
    const poolAddress = position.pool;
    const tickLower = position.tickLower;
    const tickUpper = position.tickUpper;

    console.log(`Найден пул с адресом: ${poolAddress}`);
    console.log(`Tick Lower: ${tickLower}`);
    console.log(`Tick Upper: ${tickUpper}`);

    return {
      id: position.id,
      owner: position.owner,
      pool: poolAddress,
      nftAddress: position.nftAddress,
      tickLower,
      tickUpper,
    };
  } catch (error) {
    console.error("Ошибка при запросе данных о пуле:", error);
    return null;
  }
}

export { getPoolAddressByNFT };
