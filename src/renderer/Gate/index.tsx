import { messages } from "common/butlerd";
import { Profile } from "common/butlerd/messages";
import React, { useEffect, useState } from "react";
import { Form, FormStage } from "renderer/Gate/Form";
import styled from "renderer/styles";
import { List } from "renderer/Gate/List";
import { useAsyncCallback } from "react-async-hook";
import { Deferred } from "renderer/deferred";
import { ConfirmModal } from "renderer/basics/Modal";
import { FormattedMessage } from "react-intl";
import { useSocket } from "renderer/contexts";

const GateContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;

  width: 600px;
  margin: 0 auto;

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

type ForgetConfirm = Deferred<void, void> & { profile: Profile };

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
  const [forgetConfirm, setForgetConfirm] = useState<ForgetConfirm | null>(
    null
  );

  const forgetProfile = useAsyncCallback(async (profile: Profile) => {
    try {
      await new Promise((resolve, reject) => {
        setForgetConfirm({ resolve, reject, profile });
      });
    } catch (e) {
      console.log(`Forget confirm was cancelled`);
      return;
    } finally {
      setForgetConfirm(null);
    }

    await socket.call(messages.ProfileForget, { profileId: profile.id });
    fetchProfiles("refresh");
  });

  let fetchProfiles = (purpose: "first-time" | "refresh") => {
    (async () => {
      try {
        const { profiles } = await socket.call(messages.ProfileList, {});
        setProfiles(profiles);
        if (purpose == "first-time") {
          setLoading(false);
          if (profiles.length > 0) {
            setState({ type: "list" });
          }
        } else if (purpose === "refresh") {
          if (profiles.length == 0) {
            setState({
              type: "form",
              stage: {
                type: "need-username",
              },
            });
          }
        }
      } catch (e) {
        alert("Something went very wrong: " + e.stack);
      }
    })();
  };

  useEffect(() => {
    // initial fetch
    fetchProfiles("first-time");
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // TODO: figure out where ForgetConfirm fits in all of this, not loving having
  // it only next to <List/>
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
          {forgetConfirm ? (
            <ConfirmModal
              onCancel={forgetConfirm.reject}
              onConfirm={forgetConfirm.resolve}
              confirmLabel={
                <FormattedMessage id="prompt.forget_session.action" />
              }
              question={
                <FormattedMessage
                  id="prompt.forget_session.message"
                  values={{ username: forgetConfirm.profile.user.username }}
                />
              }
            />
          ) : null}
          <List
            setState={setState}
            forgetProfile={forgetProfile.execute}
            profiles={profiles}
          />
        </GateContainer>
      );
    default:
      return <div>Unknown page</div>;
  }
};

export default Gate;
