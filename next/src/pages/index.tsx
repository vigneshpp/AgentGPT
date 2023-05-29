import React, { useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import { type GetStaticProps, type NextPage } from "next";
import Badge from "../components/Badge";
import DefaultLayout from "../layout/default";
import ChatWindow from "../components/ChatWindow";
import Drawer from "../components/Drawer";
import Input from "../components/Input";
import Button from "../components/Button";
import { FaCog, FaRobot, FaStar } from "react-icons/fa";
import PopIn from "../components/motions/popin";
import { VscLoading } from "react-icons/vsc";
import Expand from "../components/motions/expand";
import HelpDialog from "../components/HelpDialog";
import { SettingsDialog } from "../components/SettingsDialog";
import { useAuth } from "../hooks/useAuth";
import type { Message } from "../types/agentTypes";
import { isTask } from "../types/agentTypes";
import { useAgent } from "../hooks/useAgent";
import { isEmptyOrBlank } from "../utils/whitespace";
import { resetAllMessageSlices, useMessageStore } from "../stores";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useSettings } from "../hooks/useSettings";
import { languages } from "../utils/languages";
import nextI18NextConfig from "../../next-i18next.config.js";
import { SorryDialog } from "../components/SorryDialog";
import { SignInDialog } from "../components/SignInDialog";
import { env } from "../env/client.mjs";
import { ToolsDialog } from "../components/ToolsDialog";

const Home: NextPage = () => {
  const { i18n } = useTranslation();

  const addMessage = useMessageStore.use.addMessage();
  const messages = useMessageStore.use.messages();
  const updateTaskStatus = useMessageStore.use.updateTaskStatus();
  const settingsModel = useSettings();

  const { agent, saveAgent, tasks, stopAgent, startAgent } = useAgent();

  const { session, status } = useAuth();
  const [nameInput, setNameInput] = React.useState<string>("");
  const [goalInput, setGoalInput] = React.useState<string>("");
  const [mobileVisibleWindow, setMobileVisibleWindow] = React.useState<"Chat" | "Tasks">("Chat");

  const [showHelpDialog, setShowHelpDialog] = React.useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = React.useState(false);
  const [showSorryDialog, setShowSorryDialog] = React.useState(false);
  const [showSignInDialog, setShowSignInDialog] = React.useState(false);
  const [showToolsDialog, setShowToolsDialog] = React.useState(false);
  const [hasSaved, setHasSaved] = React.useState(false);
  const agentUtils = useAgent();

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = "agentgpt-modal-opened-v0.2";
    const savedModalData = localStorage.getItem(key);

    // TODO: clear timeout on unmount
    setTimeout(() => {
      if (savedModalData == null) {
        setShowHelpDialog(true);
      }
    }, 1800);

    localStorage.setItem(key, JSON.stringify(true));
    nameInputRef?.current?.focus();
  }, []);

  const setAgentRun = (newName: string, newGoal: string) => {
    if (agent != null) {
      return;
    }

    setNameInput(newName);
    setGoalInput(newGoal);
    handleNewGoal(newName, newGoal);
  };

  const handleAddMessage = (message: Message) => {
    if (isTask(message)) {
      updateTaskStatus(message);
    }

    addMessage(message);
  };

  const disableDeployAgent =
    agent != null || isEmptyOrBlank(nameInput) || isEmptyOrBlank(goalInput);

  const handleNewGoal = (name: string, goal: string) => {
    if (name.trim() === "" || goal.trim() === "") {
      return;
    }

    // Do not force login locally for people that don't have auth setup
    if (session === null && env.NEXT_PUBLIC_FORCE_AUTH) {
      setShowSignInDialog(true);
      return;
    }

    startAgent({ goal, name, settings: settingsModel.settings })
      .then(console.log)
      .catch(console.error);

    setHasSaved(false);
    resetAllMessageSlices();
  };
  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement> | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    // Only Enter is pressed, execute the function
    if (e.key === "Enter" && !disableDeployAgent && !e.shiftKey) {
      handleNewGoal(nameInput, goalInput);
    }
  };

  const handleVisibleWindowClick = (visibleWindow: "Chat" | "Tasks") => {
    // This controls whether the ChatWindow or TaskWindow is visible on mobile
    setMobileVisibleWindow(visibleWindow);
  };

  const shouldShowSave = status === "authenticated" && messages.length && !hasSaved;

  const isAgentStopped = agent?.isRunning === false; //TODO: Agent is stopped

  return (
    <DefaultLayout>
      <HelpDialog show={showHelpDialog} close={() => setShowHelpDialog(false)} />
      <ToolsDialog show={showToolsDialog} close={() => setShowToolsDialog(false)} />
      <SettingsDialog
        customSettings={settingsModel}
        show={showSettingsDialog}
        close={() => setShowSettingsDialog(false)}
      />
      <SorryDialog show={showSorryDialog} close={() => setShowSorryDialog(false)} />
      <SignInDialog show={showSignInDialog} close={() => setShowSignInDialog(false)} />
      <main className="flex min-h-screen flex-row">
        <Drawer
          showHelp={() => setShowHelpDialog(true)}
          showSettings={() => setShowSettingsDialog(true)}
        />
        <div
          id="content"
          className="z-10 flex min-h-screen w-full items-center justify-center p-2 sm:px-4 md:px-10"
        >
          <div
            id="layout"
            className="flex h-full w-full max-w-screen-xl flex-col items-center justify-between gap-1 py-2 sm:gap-3 sm:py-5 md:justify-center"
          >
            <div id="title" className="relative flex flex-col items-center font-mono">
              <div className="flex flex-row items-start shadow-2xl">
                <span className="text-4xl font-bold text-[#C0C0C0] xs:text-5xl sm:text-6xl">
                  Agent
                </span>
                <span className="text-4xl font-bold text-white xs:text-5xl sm:text-6xl">GPT</span>
                <PopIn delay={0.5}>
                  <Badge colorClass="bg-gradient-to-t from-sky-500 to-sky-600 border-2 border-white/20">
                    {`${i18n?.t("BETA", {
                      ns: "indexPage",
                    })}`}{" "}
                    🚀
                  </Badge>
                </PopIn>
              </div>
              <div className="mt-1 text-center font-mono text-[0.7em] font-bold text-white">
                <p>
                  {i18n.t("HEADING_DESCRIPTION", {
                    ns: "indexPage",
                  })}
                </p>
              </div>
            </div>

            <div>
              <Button
                className="rounded-r-none py-0 text-sm sm:py-[0.25em] xl:hidden"
                disabled={mobileVisibleWindow == "Chat"}
                onClick={() => handleVisibleWindowClick("Chat")}
              >
                Chat
              </Button>
              <Button
                className="rounded-l-none py-0 text-sm sm:py-[0.25em] xl:hidden"
                disabled={mobileVisibleWindow == "Tasks"}
                onClick={() => handleVisibleWindowClick("Tasks")}
              >
                Tasks
              </Button>
            </div>
            <Expand className="flex w-full flex-row">
              <ChatWindow
                messages={tasks}
                title="AgentGPT"
                onSave={
                  shouldShowSave
                    ? (format) => {
                        setHasSaved(true);
                        agentUtils.saveAgent({
                          goal: goalInput.trim(),
                          name: nameInput.trim(),
                          tasks: messages,
                        });
                      }
                    : undefined
                }
                scrollToBottom
                openSorryDialog={() => setShowSorryDialog(true)}
                setAgentRun={setAgentRun}
                visibleOnMobile={mobileVisibleWindow === "Chat"}
              />
              {/*<TaskWindow visibleOnMobile={mobileVisibleWindow === "Tasks"} />*/}
            </Expand>

            <div className="flex w-full flex-col gap-2 md:m-4">
              <Expand delay={1.2} className="flex flex-row items-end gap-2 md:items-center">
                <Input
                  inputRef={nameInputRef}
                  left={
                    <>
                      <FaRobot />
                      <span className="ml-2">{`${i18n?.t("AGENT_NAME", {
                        ns: "indexPage",
                      })}`}</span>
                    </>
                  }
                  value={nameInput}
                  disabled={agent != null}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e)}
                  placeholder="AgentGPT"
                  type="text"
                />
                <Button ping onClick={() => setShowToolsDialog(true)} className="h-fit">
                  <p className="mr-3">Tools</p>
                  <FaCog />
                </Button>
              </Expand>
              <Expand delay={1.3}>
                <Input
                  left={
                    <>
                      <FaStar />
                      <span className="ml-2">{`${i18n?.t("LABEL_AGENT_GOAL", {
                        ns: "indexPage",
                      })}`}</span>
                    </>
                  }
                  disabled={agent != null}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e)}
                  placeholder={`${i18n?.t("PLACEHOLDER_AGENT_GOAL", {
                    ns: "indexPage",
                  })}`}
                  type="textarea"
                />
              </Expand>
            </div>
            <Expand delay={1.4} className="flex gap-2">
              <Button
                ping={!disableDeployAgent}
                disabled={disableDeployAgent}
                onClick={() => handleNewGoal(nameInput, goalInput)}
              >
                {agent == null ? (
                  i18n.t("BUTTON_DEPLOY_AGENT", { ns: "indexPage" })
                ) : (
                  <>
                    <VscLoading className="animate-spin" size={20} />
                    <span className="ml-2">{i18n.t("RUNNING", { ns: "common" })}</span>
                  </>
                )}
              </Button>
              <Button
                disabled={agent === null}
                onClick={stopAgent}
                enabledClassName={"bg-red-600 hover:bg-red-400"}
              >
                {!isAgentStopped && agent === null ? (
                  <>
                    <VscLoading className="animate-spin" size={20} />
                    <span className="ml-2">{`${i18n?.t("BUTTON_STOPPING", {
                      ns: "indexPage",
                    })}`}</span>
                  </>
                ) : (
                  `${i18n?.t("BUTTON_STOP_AGENT", "BUTTON_STOP_AGENT", {
                    ns: "indexPage",
                  })}`
                )}
              </Button>
            </Expand>
          </div>
        </div>
      </main>
    </DefaultLayout>
  );
};

export default Home;

export const getStaticProps: GetStaticProps = async ({ locale = "en" }) => {
  const supportedLocales = languages.map((language) => language.code);
  const chosenLocale = supportedLocales.includes(locale) ? locale : "en";

  return {
    props: {
      ...(await serverSideTranslations(chosenLocale, nextI18NextConfig.ns)),
    },
  };
};
