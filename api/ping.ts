export default async function handler(req: any, res: any) {
    try {
        const server = await import("../server");
        res.status(200).json({ status: "alive", imported: true });
    } catch (error: any) {
        res.status(500).json({
            status: "error",
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}
