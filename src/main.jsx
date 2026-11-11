import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Splash from './components/Splash.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<Splash><App /></Splash>);
