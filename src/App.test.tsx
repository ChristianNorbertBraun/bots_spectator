import React from 'react';
import ReactDOM from 'react-dom';
import {App} from './App';

it('renders without crashing', () => {
    const div = document.createElement('div');
    // TODO: re-enable test :)
//    ReactDOM.render(<App/>, div);
    ReactDOM.unmountComponentAtNode(div);
});
