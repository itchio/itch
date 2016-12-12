
import urls from "../constants/urls";
import net from "../util/net";

interface IGistFiles {
  [key: string]: {
    content: string,
  };
}

export interface IGistData {
  description: string;
  public: boolean;
  files: IGistFiles;
}

export async function createGist (data: IGistData) {
  let uri = `${urls.githubApi}/gists`;
  let resp = await net.request("post", uri, data, {format: "json"});
  if (resp.statusCode === 201) {
    return resp.body;
  }
  throw new Error(`Could not create gist: HTTP ${resp.statusCode}, ${JSON.stringify(resp.body, null, 2)}`);
}

export default {createGist};
