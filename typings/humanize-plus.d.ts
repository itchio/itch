interface HumanizeStatic {
  fileSize(size: number): string;
}

/**
 * Typings for https://github.com/HubSpot/humanize
 */
declare module "humanize-plus" {
  var humanize: HumanizeStatic;
  export = humanize;
}
