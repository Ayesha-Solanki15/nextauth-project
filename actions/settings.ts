"use server";

import bcrypt from "bcryptjs";
import * as z from "zod";
import { SettingsSchema } from "@/schemas";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getUserByEmail, getUserById } from "@/data/user";
import { error } from "console";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user = await currentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const dbUser = await getUserById(user.id);
  if (!dbUser) {
    return { error: "Unauthorized" };
  }

  // these are the fields that cannot be upadted by OAuth users
  if (user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
    values.isTwoFactorEnabled = undefined;
  }

  if (values.email && values.email !== user.email) {
    // confirming the new email is not already in use by another user
    const existingUser = await getUserByEmail(values.email);
    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email already in use" };
    }

    const verificationToken = await generateVerificationToken(values.email);
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );
    return { success: "Verification email sent" };
  }

  if (values.password && values.newPassword && dbUser.password) {
    const passwordMatched = await bcrypt.compare(
      values.password,
      dbUser.password
    );
    if (!passwordMatched) {
      return { error: "Incorrect password" };
    }
    const hashedNewPassword = await bcrypt.hash(values.newPassword, 10);

    values.password = hashedNewPassword;
    values.newPassword = undefined;
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      ...values,
    },
  });

  return { success: "Settings updated!" };
};
