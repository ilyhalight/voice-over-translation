export type ReleaseSchema = {
  addons: Record<
    string,
    {
      updates: [
        {
          version: string;
          update_link: string;
        },
      ];
    }
  >;
};
