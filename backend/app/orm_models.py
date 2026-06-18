"""SQLAlchemy ORM table definitions for all i3 Space data."""
from sqlalchemy import Column, Float, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)


class Channel(Base):
    __tablename__ = "channels"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)


class TrackerRow(Base):
    __tablename__ = "tracker_rows"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(50), nullable=False)
    channel_name = Column(String(255), nullable=False)
    views = Column(Integer, default=0)
    minutes_watched = Column(Integer, default=0)


class BusinessSnapshot(Base):
    __tablename__ = "business_snapshots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(50), nullable=False)
    active_business_clients = Column(Integer, default=0)
    revenue_per_client = Column(Float, default=0.0)
    time_to_close_days = Column(Integer, default=0)
    churn_rate = Column(Float, default=0.0)


class LoyaltySnapshot(Base):
    __tablename__ = "loyalty_snapshots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(50), nullable=False)
    customer_retention_rate = Column(Float, default=0.0)
    repeat_purchase_rate = Column(Float, default=0.0)
    avg_clv = Column(Float, default=0.0)
    partnership_renewal_rate = Column(Float, default=0.0)
    referral_rate = Column(Float, default=0.0)


class OutreachSnapshot(Base):
    __tablename__ = "outreach_snapshots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(50), nullable=False)
    outreach_contacts_made = Column(Integer, default=0)
    conversion_rate = Column(Float, default=0.0)
    response_rate = Column(Float, default=0.0)
    meetings_scheduled = Column(Integer, default=0)
    followup_rate = Column(Float, default=0.0)


class SponsorshipSnapshot(Base):
    __tablename__ = "sponsorship_snapshots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(50), nullable=False)
    new_deals_closed = Column(Integer, default=0)
    revenue_growth_rate = Column(Float, default=0.0)
    avg_deal_value = Column(Float, default=0.0)
    engagement_rate = Column(Float, default=0.0)
    retention_rate = Column(Float, default=0.0)


class MediaSalesSnapshot(Base):
    __tablename__ = "media_sales_snapshots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(50), nullable=False)
    channel_sponsors = Column(Integer, default=0)
    ad_revenue_per_sponsor = Column(Float, default=0.0)


class TeamSnapshot(Base):
    __tablename__ = "team_snapshots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(50), nullable=False)
    sales_recruited = Column(Integer, default=0)
    training_hours_per_salesperson = Column(Float, default=0.0)
    sales_cycle_length_days = Column(Integer, default=0)


class VolunteerSnapshot(Base):
    __tablename__ = "volunteer_snapshots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(50), nullable=False)
    active_volunteers = Column(Integer, default=0)
    avg_time_to_fill_days = Column(Integer, default=0)
    churn_count = Column(Integer, default=0)
    nps_score = Column(Float, default=0.0)
    training_participation_rate = Column(Float, default=0.0)
    roles_with_kpis_rate = Column(Float, default=0.0)
    performance_review_completion_rate = Column(Float, default=0.0)
    mentorship_participation_rate = Column(Float, default=0.0)
