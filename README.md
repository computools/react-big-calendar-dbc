# react-big-calendar-dbc

Fork of [react-big-calendar@0.19.0](https://github.com/intljusticemission/react-big-calendar)

## Use and setup

`npm install react-bit-calendar-dbc --save`

Include `react-big-calendar-dbc/lib/css/react-big-calendar.css` for styles, and make sure your calendar's container element has a height, or the calendar won't be visible.

## What added?

* prop 'useKeymaster' (bool) - switching between months with left/right keyboard arrows
* prop 'onClickAdd' (func) - adding block that will render block with '+' sign and onClick func that was passed to this prop
* prop 'onShowMore' (func) - passing func to '+n more' text
* prop 'disableDrillDown' (bool) - disabling drilldown action when '+n more' clicked
