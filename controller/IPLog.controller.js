import IPLog from "../model/IPLog.model.js";

// POST /ip/track
export const trackIP = async (req, res) => {
  try {
     const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip;

    console.log(`Tracking IP: ${ip}`);

    const path = req.body.path || "/";
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentHit = await IPLog.findOne({
      ip,
      path,
      timestamp: { $gte: oneHourAgo },
    });

    if (!recentHit) {
      await IPLog.create({ ip, path });
      return res.status(200).json({ success: true, newVisitor: true });
    }

    res.status(200).json({ success: true, newVisitor: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /ip/track
export const getAllHits = async (req, res) => {
  try {
    const hours = parseInt(req.query.hours);
    const match = hours
      ? { timestamp: { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) } }
      : {};

    const logs = await IPLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$ip",
          lastVisit: { $max: "$timestamp" },
          paths: { $addToSet: "$path" },
          totalHits: { $sum: 1 },
        },
      },
      { $sort: { lastVisit: -1 } },
    ]);

    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /ip/track
export const deleteHits = async (req, res) => {
  try {
    const olderThanHours = parseInt(req.query.olderThanHours);
    let result;

    if (olderThanHours) {
      const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
      result = await IPLog.deleteMany({ timestamp: { $lt: cutoff } });
    } else {
      result = await IPLog.deleteMany({});
    }

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} IP logs deleted`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
