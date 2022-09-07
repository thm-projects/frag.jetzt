export interface IAppConfig {
  env: {
    name: string;
  };

  authentication: {
    lecturer: {
      allowGuest: boolean;
    };
    student: {
      allowGuest: boolean;
    };
  };
}
