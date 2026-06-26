import * as React from 'react';
import styled from 'styled-components';

const Layout = styled.main`
  font-family: system-ui, sans-serif;
  max-width: 40rem;
  margin: 4rem auto;
  padding: 0 1rem;
`;

const App: React.FC = () => {
  return (
    <Layout>
      <h1>Hello React</h1>
      <p>Edit src/App.tsx and save to get started.</p>
    </Layout>
  );
};

export default App;
