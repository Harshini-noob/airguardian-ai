import torch
import torch.nn as nn

class AQIForecastLSTM(nn.Module):
    """
    Same architecture as your MIT SST LSTM —
    sequence in, sequence out.
    Input:  (batch, seq_len=24, features=1)
    Output: (batch, forecast_horizon=24)
    """
    def __init__(self, input_size=1, hidden_size=64,
                 num_layers=2, forecast_horizon=24, dropout=0.2):
        super().__init__()
        self.hidden_size      = hidden_size
        self.num_layers       = num_layers
        self.forecast_horizon = forecast_horizon

        self.lstm = nn.LSTM(
            input_size  = input_size,
            hidden_size = hidden_size,
            num_layers  = num_layers,
            batch_first = True,
            dropout     = dropout if num_layers > 1 else 0.0
        )
        self.fc = nn.Linear(hidden_size, forecast_horizon)

    def forward(self, x):
        # x: (batch, seq_len, input_size)
        lstm_out, _ = self.lstm(x)
        # take last timestep output
        last = lstm_out[:, -1, :]        # (batch, hidden_size)
        out  = self.fc(last)             # (batch, forecast_horizon)
        return out