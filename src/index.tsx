import * as React from 'react'
import ReactDOM from 'react-dom'

import './index.scss'
import Main from './Main'

const domRoot = document.querySelector('#root')

ReactDOM.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
  domRoot
)
