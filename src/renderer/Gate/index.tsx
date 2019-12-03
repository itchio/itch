import { messages } from "common/butlerd";
import { Profile } from "common/butlerd/messages";
import React, { useEffect, useState } from "react";
import { Form, FormStage } from "renderer/Gate/Form";
import { useSocket } from "renderer/Route";
import styled from "renderer/styles";
import { List } from "renderer/Gate/List";

const GateContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  height: 100%;
`;

export type GateState = GateList | GateForm;

export interface GateList {
  type: "list";
}

export interface GateForm {
  type: "form";
  stage: FormStage;
}

export const Gate = (props: {}) => {
  const socket = useSocket();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<GateState>({
    type: "form",
    stage: {
      type: "need-username",
    },
  });
  const [profiles, setProfiles] = useState<Profile[]>([]);

  let fetchProfiles = (purpose: "first-time" | "refresh") => {
    socket.call(messages.ProfileList, {}).then(({ profiles }) => {
      setProfiles(profiles);
      if (purpose == "first-time") {
        setLoading(false);
        if (profiles.length > 0) {
          setState({ type: "list" });
        }
      }
    });
  };

  useEffect(() => {
    // initial fetch
    fetchProfiles("first-time");
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  switch (state.type) {
    case "form":
      return (
        <GateContainer>
          <Form
            setState={setState}
            stage={state.stage}
            hasSavedProfiles={profiles.length > 0}
          />
        </GateContainer>
      );
    case "list":
      return (
        <GateContainer>
          <List setState={setState} profiles={profiles} />
        </GateContainer>
      );
    default:
      return <div>Unknown page</div>;
  }
};
