import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  TextField,
  Button,
  Typography,
  Container,
  Box,
  CircularProgress,
} from "@material-ui/core";
import { login } from "../../redux/slices/authSlice";

const validationSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
  mfaCode: Yup.string(),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showMfa, setShowMfa] = useState(false);
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (values) => {
    const result = await dispatch(login(values));
    if (!result.error) {
      if (result.payload.mfa_required) {
        setShowMfa(true);
      } else {
        navigate("/dashboard");
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Login
        </Typography>
        <Formik
          initialValues={{ username: "", password: "", mfaCode: "" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, touched, errors }) => (
            <Form>
              <TextField
                fullWidth
                margin="normal"
                name="username"
                label="Username"
                value={values.username}
                onChange={handleChange}
                error={touched.username && Boolean(errors.username)}
                helperText={touched.username && errors.username}
              />
              <TextField
                fullWidth
                margin="normal"
                name="password"
                label="Password"
                type="password"
                value={values.password}
                onChange={handleChange}
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
              />
              {showMfa && (
                <TextField
                  fullWidth
                  margin="normal"
                  name="mfaCode"
                  label="MFA Code"
                  value={values.mfaCode}
                  onChange={handleChange}
                  error={touched.mfaCode && Boolean(errors.mfaCode)}
                  helperText={touched.mfaCode && errors.mfaCode}
                />
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                style={{ marginTop: "1rem" }}
              >
                {loading ? <CircularProgress size={24} /> : "Login"}
              </Button>
              {error && (
                <Typography color="error" style={{ marginTop: "1rem" }}>
                  {error}
                </Typography>
              )}
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
};

export default Login;
