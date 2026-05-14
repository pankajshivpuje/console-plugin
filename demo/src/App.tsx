import type { FC } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from 'react-router';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import {
  Page,
  Masthead,
  MastheadMain,
  MastheadBrand,
  PageSidebar,
  PageSidebarBody,
  Nav,
  NavList,
  NavItem,
  Content,
} from '@patternfly/react-core';
import PipelinesPage from './pages/PipelinesPage';
import PipelineRunsPage from './pages/PipelineRunsPage';

const sdkCoreSlice = createSlice({
  name: 'sdkCore',
  initialState: {
    user: { username: 'demo-user', uid: 'demo-uid' },
    activeNamespace: 'default',
    impersonate: {},
  },
  reducers: {},
});

const store = configureStore({
  reducer: {
    sdkCore: sdkCoreSlice.reducer,
  },
});

const DemoSidebar: FC = () => (
  <PageSidebar>
    <PageSidebarBody>
      <Nav>
        <NavList>
          <NavItem>
            <NavLink to="/pipelines">Pipelines</NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/pipeline-runs">PipelineRuns</NavLink>
          </NavItem>
        </NavList>
      </Nav>
    </PageSidebarBody>
  </PageSidebar>
);

const DemoMasthead: FC = () => (
  <Masthead>
    <MastheadMain>
      <MastheadBrand>
        <Content component="h3" style={{ color: 'white', margin: 0 }}>
          OpenShift Pipelines Console - Demo
        </Content>
      </MastheadBrand>
    </MastheadMain>
  </Masthead>
);

const App: FC = () => (
  <Provider store={store}>
    <HashRouter>
      <Page masthead={<DemoMasthead />} sidebar={<DemoSidebar />}>
        <Routes>
          <Route path="/pipelines" element={<PipelinesPage />} />
          <Route path="/pipeline-runs" element={<PipelineRunsPage />} />
          <Route path="*" element={<Navigate to="/pipelines" replace />} />
        </Routes>
      </Page>
    </HashRouter>
  </Provider>
);

export default App;
