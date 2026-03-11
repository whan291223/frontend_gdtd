export interface UserCreate {
  line_user_id: string
  display_name?: string
  picture_url?: string
  real_name?: string
  surname?: string
}

export interface UserUpdate {
  real_name: string
  surname?: string
}

const API_URL = "/api/v0.1"

export async function createUserProfile(data: UserCreate) {
  const res = await fetch(`${API_URL}/users/create_user_profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error("Failed to create user")
  }

  return res.json()
}

export async function updateUser(
  lineUserId: string,
  data: UserUpdate
) {
  const res = await fetch(`${API_URL}/users/${lineUserId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error("Failed to update user")
  }

  return res.json()
}