import { createContext, useContext, useEffect, useState } from "react";
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);