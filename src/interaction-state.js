export function createInteractionState() {
  return { phase: "IDLE" };
}

export function isPointInsideRevealZone(point, bounds) {
  return (
    Math.abs(point.x) <= bounds.halfWidth &&
    Math.abs(point.y) <= bounds.halfHeight &&
    Math.abs(point.z) <= bounds.halfDepth
  );
}

export function isPointInsideDeckTarget(point, bounds) {
  return (
    Math.abs(point.x) <= bounds.halfWidth &&
    Math.abs(point.y) <= bounds.halfHeight
  );
}

export function findNearestAvailableSlot(point, slots, snapRadius) {
  if (!Number.isFinite(snapRadius) || snapRadius <= 0) return -1;

  let nearestIndex = -1;
  let nearestDistance = snapRadius;
  slots.forEach((slot, index) => {
    if (slot.occupied) return;
    const distance = Math.hypot(point.x - slot.x, point.y - slot.y);
    if (distance <= nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  return nearestIndex;
}

export function createInputEdgeState() {
  return {
    pointerOverDeck: false,
    heldCardInRevealZone: false,
    grabActive: false,
    fistActive: false,
  };
}

export function resetInputEdgeState() {
  return createInputEdgeState();
}

export function updateInputEdgeState(state, edgeName, active) {
  return {
    state: { ...state, [edgeName]: active },
    changed: state[edgeName] !== active,
    rising: active && !state[edgeName],
  };
}

export function transitionInteraction(state, event) {
  if (event.type === "RESET") return createInteractionState();

  const transitions = {
    IDLE: {
      POINTER_ENTER_DECK: "AIMING",
    },
    AIMING: {
      POINTER_LEAVE_DECK: "IDLE",
      GRAB: "DRAGGING",
    },
    DRAGGING: {
      ENTER_REVEAL_ZONE: "READY_TO_CONFIRM",
    },
    READY_TO_CONFIRM: {
      LEAVE_REVEAL_ZONE: "DRAGGING",
      CONFIRM: "REVEALED",
    },
  };

  return {
    phase: transitions[state.phase]?.[event.type] ?? state.phase,
  };
}
