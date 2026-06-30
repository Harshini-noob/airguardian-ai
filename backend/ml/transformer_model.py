import torch
import torch.nn as nn
import math


class PositionalEncoding(nn.Module):
    """Adds position information since Transformers have no inherent sequence order"""
    def __init__(self, d_model: int, max_len: int = 100):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model)
        )
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe.unsqueeze(0))

    def forward(self, x):
        return x + self.pe[:, :x.size(1), :]


class AQIForecastTransformer(nn.Module):
    """
    Transformer-based AQI forecaster.
    Same input/output shape as LSTM for fair comparison:
    Input:  (batch, seq_len=24, features=1)
    Output: (batch, forecast_horizon=24)
    """
    def __init__(
        self,
        input_size=1,
        d_model=64,
        nhead=4,
        num_layers=2,
        forecast_horizon=24,
        dropout=0.2
    ):
        super().__init__()
        self.d_model = d_model
        self.forecast_horizon = forecast_horizon

        self.input_proj = nn.Linear(input_size, d_model)
        self.pos_encoder = PositionalEncoding(d_model)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=d_model * 4,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(
            encoder_layer, num_layers=num_layers
        )

        self.output_proj = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_model // 2, forecast_horizon)
        )

    def forward(self, x):
        x = self.input_proj(x)
        x = self.pos_encoder(x)
        x = self.transformer_encoder(x)
        pooled = x.mean(dim=1)
        out = self.output_proj(pooled)
        return out