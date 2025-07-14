import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  UID: string;

  @Prop({ lowercase: true })
  fullName: string;

  @Prop({ lowercase: true, required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: false })
  phone: string;

  @Prop({ required: false })
  studentNumber: string;

  @Prop({ lowercase: true, required: true })
  userType: number;

  @Prop({ default: 0 })
  status: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
