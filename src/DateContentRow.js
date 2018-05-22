import cn from 'classnames'
import getHeight from 'dom-helpers/query/height'
import qsa from 'dom-helpers/query/querySelectorAll'
import PropTypes from 'prop-types'
import React from 'react'
import { findDOMNode } from 'react-dom'

import dates from './utils/dates'
import { accessor, elementType } from './utils/propTypes'
import { eventSegments, endOfRange, eventLevels } from './utils/eventLevels'
import BackgroundCells from './BackgroundCells'
import EventRow from './EventRow'
import EventEndingRow from './EventEndingRow'

let isSegmentInSlot = (seg, slot) => seg.left <= slot && seg.right >= slot

const propTypes = {
  date: PropTypes.instanceOf(Date),
  events: PropTypes.array.isRequired,
  range: PropTypes.array.isRequired,

  rtl: PropTypes.bool,
  renderForMeasure: PropTypes.bool,
  renderHeader: PropTypes.func,

  container: PropTypes.func,
  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: PropTypes.number,

  onShowMore: PropTypes.func,
  onSelectSlot: PropTypes.func,
  onSelectEnd: PropTypes.func,
  onSelectStart: PropTypes.func,
  dayPropGetter: PropTypes.func,

  getNow: PropTypes.func.isRequired,
  startAccessor: accessor.isRequired,
  endAccessor: accessor.isRequired,

  eventComponent: elementType,
  eventWrapperComponent: elementType.isRequired,
  dateCellWrapperComponent: elementType,
  minRows: PropTypes.number.isRequired,
  maxRows: PropTypes.number.isRequired,

  onClickAdd: PropTypes.func,
  selectedDate: PropTypes.object,
}

const defaultProps = {
  minRows: 0,
  maxRows: Infinity,

  onClickAdd: null,
  selectedDate: null,
}

class DateContentRow extends React.Component {
  handleSelectSlot = slot => {
    const { range, onSelectSlot } = this.props

    onSelectSlot(range.slice(slot.start, slot.end + 1), slot)
  }

  handleShowMore = slot => {
    const { range, onShowMore } = this.props
    let row = qsa(findDOMNode(this), '.rbc-row-bg')[0]

    let cell
    if (row) cell = row.children[slot - 1]

    let events = this.segments
      .filter(seg => isSegmentInSlot(seg, slot))
      .map(seg => seg.event)

    onShowMore(events, range[slot - 1], cell, slot)
  }

  createHeadingRef = r => {
    this.headingRow = r
  }

  createEventRef = r => {
    this.eventRow = r
  }

  getContainer = () => {
    const { container } = this.props
    return container ? container() : findDOMNode(this)
  }

  getRowLimit() {
    let eventHeight = getHeight(this.eventRow)
    let headingHeight = this.headingRow ? getHeight(this.headingRow) : 0
    let eventSpace = getHeight(findDOMNode(this)) - headingHeight

    return Math.max(Math.floor(eventSpace / eventHeight), 1)
  }

  renderHeadingCell = (date, index) => {
    let { renderHeader, getNow } = this.props

    return renderHeader({
      date,
      key: `header_${index}`,
      className: cn(
        'rbc-date-cell',
        dates.eq(date, getNow(), 'day') && 'rbc-now'
      ),
    })
  }

  renderDummy = () => {
    let { className, range, renderHeader } = this.props
    return (
      <div className={className}>
        <div className="rbc-row-content">
          {renderHeader && (
            <div className="rbc-row" ref={this.createHeadingRef}>
              {range.map(this.renderHeadingCell)}
            </div>
          )}
          <div className="rbc-row" ref={this.createEventRef}>
            <div className="rbc-row-segment">
              <div className="rbc-event">
                <div className="rbc-event-content">&nbsp;</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const {
      date,
      rtl,
      events,
      range,
      className,
      selectable,
      dayPropGetter,
      renderForMeasure,
      startAccessor,
      endAccessor,
      getNow,
      renderHeader,
      minRows,
      maxRows,
      dateCellWrapperComponent,
      eventComponent,
      eventWrapperComponent,
      onSelectStart,
      onSelectEnd,
      longPressThreshold,
      onClickAdd,
      selectedDate,
      ...props
    } = this.props

    if (renderForMeasure) return this.renderDummy()

    let { first, last } = endOfRange(range)

    let segments = (this.segments = events.map(evt =>
      eventSegments(
        evt,
        first,
        last,
        {
          startAccessor,
          endAccessor,
        },
        range
      )
    ))

    let { levels, extra } = eventLevels(segments, Math.max(maxRows - 1, 1))
    while (levels.length < minRows) levels.push([])

    if (onClickAdd) {
      if (levels.length === 0) {
        const singleLevel = []

        range.forEach((rangeItem, index) => {
          const addEvent = {
            add: true,
            event: { title: '+', start: rangeItem },
            span: 1,
            left: index + 1,
            right: index + 1,
          }
          singleLevel.push(addEvent)
        })

        levels.push(singleLevel)
      } else if (levels.length === 1) {
        const firstLevel = []
        const secondLevel = []

        range.forEach((rangeItem, index) => {
          const firstLevelIndex = levels[0].findIndex(
            event => event.left === index + 1
          )
          const addEvent = {
            add: true,
            event: { title: '+', start: rangeItem },
            span: 1,
            left: index + 1,
            right: index + 1,
          }

          if (firstLevelIndex === -1) {
            firstLevel.push(addEvent)
          } else {
            firstLevel.push(levels[0][firstLevelIndex])
            secondLevel.push(addEvent)
          }
        })

        levels[0] = firstLevel
        levels.push(secondLevel)
      } else {
        const firstLevel = []
        const secondLevel = []

        range.forEach((rangeItem, index) => {
          const firstLevelIndex = levels[0].findIndex(
            event => event.left === index + 1
          )
          const addEvent = {
            add: true,
            event: { title: '+', start: rangeItem },
            span: 1,
            left: index + 1,
            right: index + 1,
          }

          if (firstLevelIndex === -1) {
            firstLevel.push(addEvent)
          } else {
            firstLevel.push(levels[0][firstLevelIndex])

            const secondLevelIndex = levels[1].findIndex(
              event => event.left === index + 1
            )

            if (secondLevelIndex === -1) {
              secondLevel.push(addEvent)
            } else {
              secondLevel.push(levels[1][secondLevelIndex])
            }
          }
        })

        levels[0] = firstLevel
        levels[1] = secondLevel
      }
    }

    return (
      <div className={className}>
        <BackgroundCells
          date={date}
          getNow={getNow}
          rtl={rtl}
          range={range}
          selectable={selectable}
          container={this.getContainer}
          dayPropGetter={dayPropGetter}
          onSelectStart={onSelectStart}
          onSelectEnd={onSelectEnd}
          onSelectSlot={this.handleSelectSlot}
          cellWrapperComponent={dateCellWrapperComponent}
          longPressThreshold={longPressThreshold}
          selectedDate={selectedDate}
        />

        <div className="rbc-row-content">
          {renderHeader && (
            <div className="rbc-row" ref={this.createHeadingRef}>
              {range.map(this.renderHeadingCell)}
            </div>
          )}
          {levels.map((segs, idx) => (
            <EventRow
              {...props}
              key={idx}
              start={first}
              end={last}
              segments={segs}
              slots={range.length}
              eventComponent={eventComponent}
              eventWrapperComponent={eventWrapperComponent}
              startAccessor={startAccessor}
              endAccessor={endAccessor}
              onClickAdd={onClickAdd}
            />
          ))}
          {!!extra.length && (
            <EventEndingRow
              {...props}
              start={first}
              end={last}
              segments={extra}
              onShowMore={this.handleShowMore}
              eventComponent={eventComponent}
              eventWrapperComponent={eventWrapperComponent}
              startAccessor={startAccessor}
              endAccessor={endAccessor}
            />
          )}
        </div>
      </div>
    )
  }
}

DateContentRow.propTypes = propTypes
DateContentRow.defaultProps = defaultProps

export default DateContentRow
