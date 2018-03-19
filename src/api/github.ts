import urls from "../constants/urls";
import { request } from "../net/request";

interface IGistFiles {
  [key: string]: {
    content: string;
  };
}

export interface IGistData {
  description: string;
  public: boolean;
  files: IGistFiles;
}

export async function createGist(data: IGistData) {
  let uri = `${urls.githubApi}/gists`;
  let resp = await request("post", uri, data, { format: "json" });
  if (resp.statusCode === 201) {
    return resp.body;
  }
  throw new Error(
    `Could not create gist: HTTP ${resp.statusCode}, ${JSON.stringify(
      resp.body,
      null,
      2
    )}`
  );
}
