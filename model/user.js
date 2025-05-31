import mongoose, { Schema, Document, Model } from 'mongoose'


const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: 0, required: true },
    username: { type: String, required: true, unique: true },
    phone : { type: String },
    credit: { type: Number, default: null },
    role: {
      type: String,
      default: 'user',
      enum: ['user', 'admin', 'driver'],
    },
    avatar: {
      public_id: { type: String, default: '' },
      url: { type: String, default: '' },
    },
    verificationInfo: {
      verified: { type: Boolean, default: false },
      token: { type: String, default: '' },
    },
    password_reset_token: { type: String, default: '' },
    fine: { type: Number, default: 0 },
    refreshToken: { type: String, default: '' },
  },
  { timestamps: true }
)

// Pre save middleware / hook : will work on create() save()
userSchema.pre('save', async function (next) {
  const user = this ;

  // Hash password 
  if (user.isModified('password')) {
    const saltRounds = Number(process.env.bcrypt_salt_round) || 10;
    let pass =  user.password
      user.password = await bcrypt.hash(
          pass ,
          saltRounds
      );
  }

  next();
});

// //post middleware /hook
// userSchema.post('save', function (doc, next) {
//     doc.password = '';
//     if (doc.verificationInfo) {
//         doc.verificationInfo.OTP = '';
//     }
//     doc.secureFolderPin = '';
//     next();
// });

userSchema.statics.isUserExistsByEmail = async function (email) {
  return await User.findOne({ email }).select('+password ');
};

userSchema.statics.isOTPVerified = async function (
id
) {
  const user = await User.findById(id).select('+verificationInfo');
  return user?.verificationInfo.verified;
};

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword,
  hashPassword,
) {
  return await bcrypt.compare(plainTextPassword, hashPassword);
};



export const User = mongoose.model('User', userSchema)
