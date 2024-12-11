import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/Tasks';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<TasksPage />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;