export type Scenario = {
  tree: {
    depth: number;
    breadth: number;
    componentTypes: ("text" | "layout" | "list")[];
  };
  hooks: {
    useStatePerComp: number;
    useEffectPerComp: number;
    useLayoutEffectPerComp: number;
    useMemoPerComp: number;
    useCallbackPerComp: number;
    useRefPerComp: number;
  };
  context: { providers: number; consumersPerProvider: number; updateHz: number };
  churn: {
    propHz: number;
    stateHz: number;
    contextHz: number;
    transitionRatio: number; // 0..1
  };
  payload: { domNodesPerLeaf: number; listRows: number; virtualization: boolean };
  reactFlags: { strictMode: boolean };
  durationSec: number;
};

export const defaultScenario: Scenario = {
  tree: { depth: 2, breadth: 3, componentTypes: ["text", "layout"] },
  hooks: {
    useStatePerComp: 1,
    useEffectPerComp: 1,
    useLayoutEffectPerComp: 0,
    useMemoPerComp: 1,
    useCallbackPerComp: 1,
    useRefPerComp: 1,
  },
  context: { providers: 1, consumersPerProvider: 2, updateHz: 2 },
  churn: { propHz: 2, stateHz: 2, contextHz: 1, transitionRatio: 0.3 },
  payload: { domNodesPerLeaf: 2, listRows: 200, virtualization: true },
  reactFlags: { strictMode: true },
  durationSec: 60,
};

