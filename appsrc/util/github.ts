
import urls from "../constants/urls";
import {requestAsync} from "../promised/needle";

interface IGistFiles {
  [key: string]: {
    content: string
  };
}

export interface IGistData {
  description: string;
  public: boolean;
  files: IGistFiles;
}

export async function createGist (data: IGistData) {
  let uri = `${urls.githubApi}/gists`;
  let resp = await requestAsync("post", uri, data, {json: true});
  if (resp.statusCode === 201) {
    return resp.body;
  }
  throw new Error(`Could not create gist: HTTP ${resp.statusCode}, ${JSON.stringify(resp.body, null, 2)}`);
}

export default {createGist};
