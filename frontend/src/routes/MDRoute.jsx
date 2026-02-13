import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Result, Button } from 'antd';
import { ROUTES } from '../constants/permissions';

const MDRoute = ({ children }) => {
  const { IsMD } = useSelector(state => state.auth);

  if (IsMD !== 1) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle="Sorry, you are not authorized to access this page. Only MD users can access approval pages."
        extra={<Button type="primary" href={ROUTES.DASHBOARD}>Back to Dashboard</Button>}
      />
    );
  }

  return children;
};

export default MDRoute;
