
import React from 'react'
import {createDevTools} from 'redux-devtools'

// Monitors are separate packages, and you can make a custom one
import FilterMonitor from 'redux-devtools-filter-actions'
import LogMonitor from 'redux-devtools-log-monitor'
import DockMonitor from 'redux-devtools-dock-monitor'

// createDevTools takes a monitor and produces a DevTools component
const DevTools = createDevTools(
  <DockMonitor toggleVisibilityKey='ctrl-h' changePositionKey='ctrl-q'>
    <FilterMonitor blacklist={['EFFECT_TRIGGERED', 'EFFECT_RESOLVED', 'EFFECT_REJECTED', 'WINDOW_FOCUS_CHANGED']}>
      <LogMonitor theme='tomorrow'/>
    </FilterMonitor>
  </DockMonitor>
)

export default DevTools
