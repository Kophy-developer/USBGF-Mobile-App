import React from 'react';
import { EventsScreen } from './EventsScreen';

export const OnlineEventsScreen: React.FC = () => {
  return <EventsScreen initialViewType="ONLINE" lockViewType />;
};

