import { ApolloClient, InMemoryCache } from "@apollo/client/core";

export function createApolloClient() {
  return new ApolloClient({
    uri: "https://indexer.tonco.io/",
    credentials: "same-origin",
    cache: new InMemoryCache(),
  });
}