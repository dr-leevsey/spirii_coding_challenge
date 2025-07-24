import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class UserIdParamDto {
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  @Length(4, 20, { message: 'User ID must be between 4 and 20 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'User ID can only contain alphanumeric characters, underscores, and hyphens',
  })
  userId: string;
}
