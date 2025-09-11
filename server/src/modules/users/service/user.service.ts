/**
 * User service layer with business logic and strict typing
 */

import bcrypt from "bcryptjs";
import { User, type IUserDocument } from "@/modules/users/models/user.model.js";
import type {
	CreateUserData,
	UpdateUserData,
	PublicUser,
	UserWithTimestamps,
	Role,
} from "@/modules/users/types/user.type.js";
import type { Result } from "@/shared/types/common.js";
import {
	NotFoundError,
	ConflictError,
	DatabaseError,
	AuthenticationError,
} from "@/shared/utils/error-handler.js";

export class UserService {
	/**
	 * Create a new user
	 */
	async createUser(
		userData: CreateUserData
	): Promise<Result<PublicUser, Error>> {
		try {
			// Check if user already exists
			const existingUser = await User.findOne({
				email: userData.email.toLowerCase(),
			});
			if (existingUser) {
				return {
					success: false,
					error: new ConflictError("User with this email already exists"),
				};
			}

			// Hash password
			const salt = await bcrypt.genSalt(12);
			const hashedPassword = await bcrypt.hash(userData.password, salt);

			// Create user
			const user = new User({
				...userData,
				password: hashedPassword,
				email: userData.email.toLowerCase(),
			});

			const savedUser = await user.save();
			const publicUser = this.toPublicUser(savedUser);

			return { success: true, data: publicUser };
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Failed to create user", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Find user by ID
	 */
	async findById(id: string): Promise<Result<PublicUser, Error>> {
		try {
			const user = await User.findById(id);
			if (!user) {
				return { success: false, error: new NotFoundError("User") };
			}

			const publicUser = this.toPublicUser(user);
			return { success: true, data: publicUser };
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Failed to find user", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Find user by email
	 */
	async findByEmail(email: string): Promise<Result<IUserDocument, Error>> {
		try {
			const user = await User.findOne({ email: email.toLowerCase() }).select(
				"+password"
			);
			if (!user) {
				return { success: false, error: new NotFoundError("User") };
			}

			return { success: true, data: user };
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Failed to find user", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Update user
	 */
	async updateUser(
		id: string,
		updateData: UpdateUserData
	): Promise<Result<PublicUser, Error>> {
		try {
			const user = await User.findById(id);
			if (!user) {
				return { success: false, error: new NotFoundError("User") };
			}

			// Check email uniqueness if email is being updated
			if (updateData.email && updateData.email.toLowerCase() !== user.email) {
				const existingUser = await User.findOne({
					email: updateData.email.toLowerCase(),
				});
				if (existingUser) {
					return {
						success: false,
						error: new ConflictError("Email already in use"),
					};
				}
			}

			// Update user
			Object.assign(user, {
				...updateData,
				...(updateData.email && { email: updateData.email.toLowerCase() }),
			});

			const savedUser = await user.save();
			const publicUser = this.toPublicUser(savedUser);

			return { success: true, data: publicUser };
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Failed to update user", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Delete user
	 */
	async deleteUser(id: string): Promise<Result<void, Error>> {
		try {
			const user = await User.findById(id);
			if (!user) {
				return { success: false, error: new NotFoundError("User") };
			}

			await User.findByIdAndDelete(id);
			return { success: true, data: undefined };
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Failed to delete user", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Authenticate user
	 */
	async authenticateUser(
		email: string,
		password: string
	): Promise<Result<PublicUser, Error>> {
		try {
			const userResult = await this.findByEmail(email);
			if (!userResult.success) {
				return {
					success: false,
					error: new AuthenticationError("Invalid credentials"),
				};
			}

			const user = userResult.data;
			const isPasswordValid = await bcrypt.compare(password, user.password);
			if (!isPasswordValid) {
				return {
					success: false,
					error: new AuthenticationError("Invalid credentials"),
				};
			}

			const publicUser = this.toPublicUser(user);
			return { success: true, data: publicUser };
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Authentication failed", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Get users with pagination and filtering
	 */
	async getUsers(options: {
		page: number;
		limit: number;
		search?: string;
		role?: Role;
		sortBy: string;
		sortOrder: "asc" | "desc";
	}): Promise<Result<{ users: PublicUser[]; total: number }, Error>> {
		try {
			const { page, limit, search, role, sortBy, sortOrder } = options;
			const skip = (page - 1) * limit;

			// Build query
			const query: any = {};
			if (search) {
				query.$or = [
					{ name: { $regex: search, $options: "i" } },
					{ email: { $regex: search, $options: "i" } },
				];
			}
			if (role) {
				query.role = role;
			}

			// Build sort
			const sort: any = {};
			sort[sortBy] = sortOrder === "asc" ? 1 : -1;

			// Execute queries
			const [users, total] = await Promise.all([
				User.find(query).sort(sort).skip(skip).limit(limit),
				User.countDocuments(query),
			]);

			const publicUsers = users.map((user) => this.toPublicUser(user));

			return { success: true, data: { users: publicUsers, total } };
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Failed to get users", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Change user password
	 */
	async changePassword(
		id: string,
		currentPassword: string,
		newPassword: string
	): Promise<Result<void, Error>> {
		try {
			const user = await User.findById(id).select("+password");
			if (!user) {
				return { success: false, error: new NotFoundError("User") };
			}

			const isCurrentPasswordValid = await bcrypt.compare(
				currentPassword,
				user.password
			);
			if (!isCurrentPasswordValid) {
				return {
					success: false,
					error: new AuthenticationError("Current password is incorrect"),
				};
			}

			const salt = await bcrypt.genSalt(12);
			user.password = await bcrypt.hash(newPassword, salt);
			await user.save();

			return { success: true, data: undefined };
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Failed to change password", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Convert database user to public user
	 */
	private toPublicUser(user: IUserDocument): PublicUser {
		return {
			id: user._id.toString(),
			name: user.name,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};
	}
}

// Export singleton instance
export const userService = new UserService();
