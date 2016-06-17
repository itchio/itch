
async function loginFailed (store, action) {
  const {username} = action.payload
  const usernameField = document.querySelector('#login-username')
  if (usernameField) {
    usernameField.value = username
  }
}

export default {loginFailed}
