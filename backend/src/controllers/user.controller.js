import prisma from "../prismaClient.js";

export const updateEmailConfig = async (req, res) => {
    const { emailConfig } = req.body;
    if (!emailConfig) return res.status(400).json({ message: "Email config is required" });
    if (!emailConfig.emailUser || !emailConfig.emailPass) return res.status(400).json({ message: "Email config is invalid" });


    const user = await prisma.accountUser.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const updatedUser = await prisma.accountUser.update({
        where: { id: req.user.id },
        data: { emailUser: emailConfig.emailUser, emailPass: emailConfig.emailPass }
    });
    res.json({ message: "Email config updated successfully", updatedUser });
};

export const getEmailConfig = async (req, res) => {
    const user = await prisma.accountUser.findUnique({ where: { id: req.user.id } });
    res.json({ user });
};
