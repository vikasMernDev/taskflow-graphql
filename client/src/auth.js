import { gql } from "@apollo/client";

export const REGISTER = gql`
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) { id email }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) { id email }
  }
`;

export const LOGOUT = gql`
  mutation Logout { logout }
`;

export const GET_ME = gql`
  query Me { me { id email } }
`;
