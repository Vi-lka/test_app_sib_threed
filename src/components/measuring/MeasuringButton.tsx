import React, { useEffect, useState } from 'react'
import './measuringButton.css'

export type MeasuringButtonProps = {
  rulerIcon: string,
  onClick: any,
  measuringMode: boolean,
}

function MeasuringButton(props: MeasuringButtonProps) {
    
  return (
    <>
      <div className='ruler-container' onClick={props.onClick}>
        <img 
          className={props.measuringMode ? 'ruler-icon-active' : 'ruler-icon'}
          src={props.rulerIcon} 
          alt="Линейка" 
          title="Линейка"
        />
        <p className='ruler-state'>
          {props.measuringMode ? 'on' : 'off'}
        </p>
      </div>
    </>
  )
}

export default MeasuringButton
