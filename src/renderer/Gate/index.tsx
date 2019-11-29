import { messages } from "common/butlerd";
import { Profile, ProfileLoginWithAPIKey } from "common/butlerd/messages";
import React, { useState, useEffect, useRef } from "react";
import { useAsyncCallback } from "react-async-hook";
import { useSocket } from "renderer/Route";
import styled, { animations, boxy } from "renderer/styles";
import { Button } from "renderer/basics/Button";
import { FormattedMessage } from "react-intl";
import { IconButton } from "renderer/basics/IconButton";
import { Link } from "renderer/basics/Link";
import { TimeAgo } from "renderer/basics/TimeAgo";

export const Links = styled.div`
  margin: 1em 0;
  text-align: center;
`;

const ListContainer = styled.div`
  animation: ${animations.fadeIn} 0.2s;

  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
`;

const GateContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  height: 100%;
`;

type PageName = "list" | "form";

export const Gate = (props: {}) => {
  const socket = useSocket();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<PageName>("form");
  const [profiles, setProfiles] = useState<Profile[]>([]);

  let fetchProfiles = (purpose: "first-time" | "refresh") => {
    socket.call(messages.ProfileList, {}).then(({ profiles }) => {
      setProfiles(profiles);
      if (purpose == "first-time") {
        setLoading(false);
        if (profiles.length > 0) {
          setPage("list");
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

  switch (page) {
    case "form":
      return (
        <GateContainer>
          <Form showList={() => setPage("list")} />
        </GateContainer>
      );
    case "list":
      return (
        <GateContainer>
          <List showForm={() => setPage("form")} profiles={profiles} />
        </GateContainer>
      );
    default:
      return <div>Unknown page</div>;
  }
};

interface ListProps {
  showForm: () => void;
  profiles: Profile[];
}

export const List = (props: ListProps) => {
  const socket = useSocket();
  const forgetProfile = useAsyncCallback(async (profileId: number) => {
    // TODO: add confirmation first
    socket.call(messages.ProfileForget, { profileId });
  });

  return (
    <ListContainer>
      {props.profiles.map(profile => (
        <Item
          key={profile.user.id}
          profile={profile}
          forgetProfile={forgetProfile.execute}
        />
      ))}

      <Links>
        <Link
          label={<FormattedMessage id="login.action.show_form" />}
          onClick={props.showForm}
        />
      </Links>
    </ListContainer>
  );
};

const ItemDiv = styled.div`
  ${boxy};
  flex-shrink: 0;
  min-width: 380px;
  border-radius: 2px;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 8px 4px;

  .avatar {
    filter: grayscale(100%);

    width: 64px;
    height: 64px;
    border-radius: 2px;
    margin-right: 4px;
  }

  &:hover .avatar {
    filter: grayscale(0%);
  }

  p {
    padding: 2px 0;
  }

  .rest {
    padding: 6px 8px;
  }

  .filler {
    flex-grow: 8;
  }

  .username {
    color: ${props => props.theme.baseText};
    font-size: ${props => props.theme.fontSizes.huge};
    font-weight: bold;
    padding: 4px 0;
  }

  .last-connected {
    color: ${props => props.theme.secondaryText};
    font-size: 14px;
  }

  box-shadow: 0 0 4px ${props => props.theme.sidebarBackground};

  &:hover {
    box-shadow: 0 0 8px ${props => props.theme.sidebarBackground};
    cursor: pointer;
  }

  &:active {
    filter: brightness(70%);
  }
`;

interface ItemProps {
  profile: Profile;
  forgetProfile: (profileId: number) => void;
}

export const Item = (props: ItemProps) => {
  const socket = useSocket();
  const login = useAsyncCallback(async () => {
    try {
      console.log(`Using saved login...`);
      await socket.call(messages.ProfileUseSavedLogin, {
        profileId: props.profile.id,
      });
      console.log(`Using saved login...done`);
    } catch (e) {
      console.error(`While using saved login: `, e.stack);
    }
  });

  const { profile } = props;
  const coverUrl = profile.user.stillCoverUrl || profile.user.coverUrl;
  const displayName = profile.user.displayName || profile.user.username;

  return (
    <ItemDiv className="remembered-profile" onClick={login.execute}>
      <img className="avatar" src={coverUrl} />
      <div className="rest">
        <p className="username">{displayName}</p>
        <p className="last-connected">
          <FormattedMessage id="login.remembered_session.last_connected" />{" "}
          <TimeAgo date={profile.lastConnected} />
        </p>
      </div>
      <div className="filler" />
      <span
        data-rh-at="left"
        data-rh={JSON.stringify(["prompt.forget_session.action"])}
      >
        <IconButton
          icon="cross"
          className="forget-profile"
          onClick={() => props.forgetProfile(profile.id)}
        />
      </span>
    </ItemDiv>
  );
};

interface FormProps {
  showList: () => void;
}

export const Form = (props: FormProps) => {
  const socket = useSocket();
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const login = useAsyncCallback(async () => {
    try {
      console.log(`Attempting password login...`);
      await socket.call(messages.ProfileLoginWithPassword, {
        username: usernameRef.current!.value,
        password: passwordRef.current!.value,
      });
      console.log(`Attempting password login...done`);
    } catch (e) {
      console.error(`While doing login password`, e.stack);
    }
  });

  return (
    <ListContainer>
      <label>
        Username
        <input ref={usernameRef} />
      </label>
      <label>
        Password
        <input type="password" ref={passwordRef} />
      </label>
      <Button disabled={login.loading} onClick={login.execute}>
        <FormattedMessage id="login.action.login" />
      </Button>
    </ListContainer>
  );
};
