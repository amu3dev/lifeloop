// Picks the one thing the user should do next in today's loop.
// `route` is a navigation target; `action` is null when there is nothing left to do.
export const getNextAction = ({ today, anchors, now }) => {
  const nextPriority = today.priorities.find(priority => !priority.completed);
  const isWindDown = now >= anchors.reviewAt;

  if (today.review) {
    return {
      icon: 'check-circle',
      label: 'Loop closed',
      title: 'Nice work. See you tomorrow.',
      action: null
    };
  }
  if (!today.checkIn) {
    return {
      icon: 'wb-twilight',
      label: now < anchors.checkInAt ? `Check-in opens ${anchors.checkInLabel}` : 'Start your day',
      title: 'Check in and pick your top 3',
      action: { label: 'Check in', icon: 'arrow-forward', route: 'CheckIn' }
    };
  }
  if (!isWindDown && today.priorities.length === 0) {
    return {
      icon: 'playlist-add',
      label: 'No priorities yet',
      title: 'Add something to focus on today',
      action: { label: 'Add', icon: 'add', route: 'CheckIn' }
    };
  }
  if (isWindDown || !nextPriority) {
    return {
      icon: 'nights-stay',
      label: isWindDown ? 'Time to wind down' : 'Top 3 done',
      title: 'Close your day with a quick review',
      action: { label: 'Review', icon: 'arrow-forward', route: 'Review' }
    };
  }
  return {
    icon: 'track-changes',
    label: 'Up next',
    title: nextPriority.title,
    action: { label: '25 min', icon: 'play-arrow', route: 'FocusFlow' }
  };
};
