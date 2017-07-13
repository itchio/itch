const state = {
  preferences: {
    installLocations: {
      kansas: {
        path: "/not/there/anymore",
      },
    },
    defaultInstallLocation: "appdata",
  },
};

export default {
  getState: () => {
    return state;
  },
};
